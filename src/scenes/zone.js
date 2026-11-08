// 근접 컷 장면이다. 장면 하나를 zoneId만 바꿔 옷장, 책상, 침대, 바닥 네 구역에 다시 쓴다.
// 그 구역의 드롭 대상과 물건을 그리고, 누르기와 끌기와 놓기를 ItemManager로 넘긴다.
// 물건을 들고 있는 동안에는 메모 카드를 띄우고, 사진을 처음 누르면 회상 장면으로 넘어간다.

const SceneZone = {
  zoneId: null,
  zone: null,

  enter(params) {
    this.zoneId = params.zoneId;
    this.zone = ZONES.find(z => z.id === params.zoneId);
  },

  update() {},

  // 근접 컷의 바탕, 드롭 대상, 물건을 그린다. 회상 장면도 이 함수로 밑그림을 깐다.
  // m이 null이면 마우스 올림 효과 없이 그린다.
  drawScene(m) {
    noStroke();
    fill(...UI.COLOR.zoneBg);
    rect(0, 0, UI.W, UI.H);

    const held = ItemManager.held();
    const hoverTarget = held && m ? ItemManager.targetAt(this.zoneId, m) : null;
    for (const target of this.zone.targets) {
      UI.drawTarget(target, ItemManager.targetCount(this.zoneId, target.type), target === hoverTarget, Game.debugView);
    }

    const hoverItem = m && !ItemManager.isBusy() ? ItemManager.itemAt(this.zoneId, m) : null;
    for (const s of ItemManager.statesIn(this.zoneId)) {
      if (!ItemManager.isVisible(s) || s === held) continue;
      UI.drawItem(s, ItemManager.currentRect(s), { hover: s === hoverItem, debug: Game.debugView });
    }

    // 들고 있는 물건은 커서를 따라 맨 위에 그린다.
    if (held) UI.drawItem(held, ItemManager.heldRect(), { hover: true, debug: Game.debugView });
  },

  draw(m) {
    this.drawScene(m);
    const busy = ItemManager.isBusy();
    UI.drawHud(this.zone.name, {
      backButton: true,
      backHover: !busy && UI.inRect(m, UI.BACK_BUTTON),
      backDisabled: busy
    });
    if (Game.debugView) UI.drawDebugFrame(UI.BACK_BUTTON, 'back');
    const held = ItemManager.held();
    if (held) UI.drawMemoCard(held.def);
  },

  isClickable(m) {
    if (ItemManager.isBusy()) return false;
    return UI.inRect(m, UI.BACK_BUTTON) || ItemManager.itemAt(this.zoneId, m) !== null;
  },

  isDragging() {
    return ItemManager.held() !== null;
  },

  pressed(m) {
    if (UI.inRect(m, UI.BACK_BUTTON)) {
      if (!ItemManager.isBusy()) Game.goTo('room');
      return;
    }
    const started = ItemManager.pressAt(this.zoneId, m);
    if (started && started.action === 'flashback') {
      // 회상은 이 근접 컷 위에 겹쳐 재생되고, 끝나면 같은 근접 컷으로 돌아온다.
      Game.goTo('flashback', { zoneId: this.zoneId, itemId: started.item.def.id });
    }
  },

  dragged(m) {
    ItemManager.moveTo(m);
  },

  released(m) {
    const outcome = ItemManager.releaseAt(this.zoneId, m);
    if (!outcome) return;
    if (outcome.result === 'rejected') {
      // 무슨 일이 있었는지 알려 준다. 물건은 이미 제자리로 돌아가 있다.
      Game.showToast(outcome.target.label + '에는 넣을 수 없어서 제자리로 돌아갔다');
    } else if (outcome.result === 'fold' && !outcome.counted) {
      // 쓸기로 세지 않았을 때 다음에 무엇을 하면 되는지 알려 준다.
      Game.showToast('이불은 좌우로 길게 쓸어야 개진다');
    }
  }
};
