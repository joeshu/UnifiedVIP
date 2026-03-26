const Platform = {
  isQX: typeof $task !== 'undefined',
  isLoon: typeof $loon !== 'undefined',
  isSurge: typeof $httpClient !== 'undefined' && typeof $loon === 'undefined',
  isStash: typeof $stash !== 'undefined',

  getName() {
    if (this.isQX) return 'QX';
    if (this.isLoon) return 'Loon';
    if (this.isSurge) return 'Surge';
    if (this.isStash) return 'Stash';
    return 'Unknown';
  }
};
