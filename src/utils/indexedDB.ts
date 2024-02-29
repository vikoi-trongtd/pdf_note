export const IDB_PDF_NOTE = 'pdf_notes';

export enum PdfNoteStores {
  highlightResult = "highlight_results",
  requestsHistory = "requests_history",
};

const IDBVersion = 1;
type IndexedDBNames = typeof IDB_PDF_NOTE;

const idb = window.indexedDB;
// || window.mozIndexedDB
// || window.webkitIndexedDB
// || window.msIndexedDB
// || window.shimIndexedDB;

export const openIDB = (dbName: IndexedDBNames, storeName: string): Promise<IDBDatabase | undefined> => {
  return new Promise((resolve)=>{
    // const dbVersion = IDB_VERSIONS[dbName];
    const openRequest = idb.open(dbName, IDBVersion);
  
    openRequest.onsuccess = () => {
      // console.log('openIDB', openRequest.result);
      resolve(openRequest.result);
    };
  
    openRequest.onerror = (event) => {
      const target = event.target as any; 
      console.error('Error opening IndexedDB:', target.error);
      resolve(undefined);
    };

    openRequest.onupgradeneeded = (event) => {
      const target = event.target as any; 
      const db = target.result;
      // console.log("openDb.onupgradeneeded");
      // Create all stores here
      Object.values(PdfNoteStores).forEach((value) => {
        if (!db.objectStoreNames.contains(value)) {
          db.createObjectStore(value, { keyPath: 'id', autoIncrement: true });
        }
      })
    };
  
  });
};

export const addDataIDB = (db: IDBDatabase, storeName: string,data: any, keyVal: string): Promise<boolean> => {
  return new Promise( async(resolve) =>{

    if (!db) resolve(false);
    // Check if data is existed?
    let shouldAdd = true;
    if (keyVal){
      const listData = await getAllDataIDB(db, storeName);
      if (Array.isArray(listData)){
        const isDataExisted = listData.some( fileData => fileData[keyVal] === data[keyVal]);
        shouldAdd = !isDataExisted;
      }
    }
    // Do the add
    if (shouldAdd){
      try{
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);

        const request = store.put(data);
        request.onsuccess = () => {
          // console.log('Data added successfully to IndexedDB', event.currentTarget);
          resolve(true);
        };
        request.onerror = () => {
          // const curTarget = event.currentTarget as any; 
          // console.error('Error adding data to IndexedDB:', curTarget.error);
          resolve(false);
        };
        // Close the resource
        tx.oncomplete = ()=>{
          db.close();
        }
      } catch (err){
        console.trace(err);
        resolve(false);
      }
    } else {
      // Data existed => add ok.
      resolve(true);
    }
  });
};

export const getAllDataIDB = (db: IDBDatabase, storeName: string): Promise<any[]| boolean> => {
  return new Promise<any[]| boolean>((resolve) => {
    if (!db) return resolve(false);

    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    
    const listData: any[] = [];
    store.openCursor().onsuccess = (event) => {
      const target = event.target as any;
      const cursor = target.result;
      if (cursor) {
        listData.push(cursor.value);
        cursor.continue();
      } else {
        // console.log("Entries all displayed.", listData);
        resolve(listData);
      }
    };
  });
};
