export function createLatestTask(onSuccess, onError = () => {}) {
  let revision = 0;

  return {
    invalidate() {
      revision += 1;
    },

    async run(task) {
      const currentRevision = ++revision;
      let result;
      try {
        result = await task();
      } catch (error) {
        if (currentRevision === revision) onError(error);
        return false;
      }

      if (currentRevision !== revision) return false;
      onSuccess(result);
      return true;
    },
  };
}
