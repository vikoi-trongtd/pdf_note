//
const useLocalStorage = (name: LocalStorageItem): Function[] => {
  const getLocalStorage = () => {
    const local = localStorage.getItem(name);
    if (local != null) {
      return JSON.parse(local);
    }
    return null;
  };

  const setLocalStorage = (item: Object) => {
    localStorage.setItem(name, JSON.stringify(item));
  };

  const removeLocalStorage = () => {
    return localStorage.removeItem(name);
  };

  return [getLocalStorage, setLocalStorage, removeLocalStorage];
};

export const LSI__HIGHLIGHT = "highlights";
type LocalStorageItem = typeof LSI__HIGHLIGHT;
export default useLocalStorage;
