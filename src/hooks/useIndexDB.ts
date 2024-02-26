// import { useEffect, useState } from 'react';

// export const IDB__HIGHLIGHT_RESULTS = "highlight_results";

// type IndexedDBNames = typeof IDB__HIGHLIGHT_RESULTS;
// const IDB_VERSIONS: Record<IndexedDBNames, number> = {
//   IDB__HIGHLIGHT_RESULTS: 1,
// } as unknown as Record<IndexedDBNames, number>;

// export interface IDBHook {
//   dbName: IndexedDBNames;
//   storeName: string;
// }

// const useIndexedDB = ({ dbName, storeName }: IDBHook) => {
//   const [db, setDb] = useState<IDBDatabase | null>(null);

//   useEffect(() => {
//     const openRequest = indexedDB.open(dbName, IDB_VERSIONS[dbName]);

//     openRequest.onupgradeneeded = () => {
//       const db = openRequest.result;
//       if (!db.objectStoreNames.contains(storeName)) {
//         db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
//       }
//     };

//     openRequest.onsuccess = () => {
//       setDb(openRequest.result);
//     };

//     openRequest.onerror = (event) => {
//       const curTarget = event.currentTarget as any; 
//       console.error('Error opening IndexedDB:', curTarget.error);
//     };

//     return () => {
//       if (db) {
//         db.close();
//       }
//     };
//   }, [db, dbName, storeName]);

//   const addData = async (data: any) => {
//     if (!db) return;

//     const transaction = db.transaction(storeName, 'readwrite');
//     const store = transaction.objectStore(storeName);

//     const request = store.add(data);
//     request.onsuccess = () => {
//       console.log('Data added successfully to IndexedDB');
//     };
//     request.onerror = (event) => {
//       const curTarget = event.currentTarget as any; 
//       console.error('Error adding data to IndexedDB:', curTarget.error);
//     };
//   };

//   const getAllData = async () => {
//     return new Promise<any[]>((resolve, reject) => {
//       if (!db) return reject('Database is not available');

//       const transaction = db.transaction(storeName, 'readonly');
//       const store = transaction.objectStore(storeName);
//       const request = store.getAll();

//       request.onsuccess = () => {
//         resolve(request.result);
//       };
//       request.onerror = (event) => {
//         const curTarget = event.currentTarget as any; 
//         reject(curTarget.error);
//       };
//     });
//   };

//   return {
//     addData,
//     getAllData,
//   };
// };

// export default useIndexedDB;



// // async function getData(id) {
// //   const db = (await openDatabase()) as any;
// //   const transaction = db.transaction(["data"], "readonly");
// //   const objectStore = transaction.objectStore("data");
// //   const request = objectStore.get(id);

// //   return new Promise((resolve, reject) => {
// //     request.onsuccess = (event: any) => {
// //       resolve(event.target.result);
// //     };

// //     request.onerror = (event: any) => {
// //       reject("Failed to get data: " + event.target.error);
// //     };
// //   });
// // }

// // // Example usage:
// // const myData = {
// //   name: "example",
// //   blob: new Blob(["Hello, world!"], { type: "text/plain" }), // Example Blob
// // };

// // saveData(IDB__HIGHLIGHT_RESULTS, myData)
// //   .then(() => console.log("Data saved successfully"))
// //   .catch((error) => console.error("Error saving data:", error));

// // getData(1)
// //   .then((data) => console.log("Retrieved data:", data))
// //   .catch((error) => console.error("Error retrieving data:", error));
export {};
