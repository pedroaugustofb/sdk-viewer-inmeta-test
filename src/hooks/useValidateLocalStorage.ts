export default function useValidateLocalStorage() {
  function setItem(key: string, value: any, ttl: number) {
    const now = new Date();

    const item = {
      value: value,
      expiry: now.getTime() + ttl,
    };

    localStorage.setItem(key, JSON.stringify(item));
  }

  function getItem(key: string) {
    const itemStr = localStorage.getItem(key);

    if (!itemStr) {
      return null;
    }

    const item = JSON.parse(itemStr);

    if (new Date().getTime() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }

    return item.value;
  }

  return { setItem, getItem };
}
