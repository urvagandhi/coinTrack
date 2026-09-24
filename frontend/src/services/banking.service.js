const ifscCache = new Map();

export const bankingService = {
  getIfscDetails: async ifscCode => {
    if (!ifscCode || ifscCode.trim().length !== 11) return null;
    const clean = ifscCode.trim().toUpperCase();

    if (ifscCache.has(clean)) {
      return ifscCache.get(clean);
    }

    try {
      const response = await fetch(
        `/api/ifsc?code=${encodeURIComponent(clean)}`
      );
      if (!response.ok) return null;
      const data = await response.json();
      if (data && !data.error) {
        ifscCache.set(clean, data);
        return data;
      }
      return null;
    } catch {
      return null;
    }
  },
};

export default bankingService;
