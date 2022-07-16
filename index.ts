import fetch from "node-fetch";

let makeError = (code: number, message: string) => {
   return { code, message };
};

interface Tokens {
   access_token: string;
}

export async function createAlbum(title: string, tokens: Tokens) {
   return new Promise((resolve, reject) => {
      fetch("https://photoslibrary.googleapis.com/v1/albums", {
         method: "POST",
         headers: {
            "Content-type": "application/json",
            Authorization: "Bearer " + tokens.access_token,
         },
         body: JSON.stringify({ album: { title } }),
      })
         .then((result) =>
            result
               .json()
               .then((resultJSON : any) => {
                  if (resultJSON.error) reject(resultJSON.error);
                  else resolve(resultJSON);
               })
               .catch((_) => reject(makeError(0, "error with json"))),
         )
         .catch((_) => reject(makeError(0, "error with network")));
   });
}

//separate fetching from URL, making blob from this function
export async function uploadURL(url: string, filename: string, referer: string, tokens: Tokens) {
   return new Promise((resolve, reject) => {
      fetch(url, { headers: { referer: url } })
         .then((result) => {
            result
               .blob()
               .then((blobResult) => {
                  fetch("https://photoslibrary.googleapis.com/v1/uploads", {
                     method: "POST",
                     headers: {
                        Authorization: "Bearer " + tokens.access_token,
                        "Content-type": "application/octet-stream",
                        "X-Goog-Upload-File-Name": filename,
                        "X-Goog-Upload-Protocol": "raw",
                     },
                     body: blobResult as unknown,
                  })
                     .then((uploadResult) => {
                        if (uploadResult.status == 200)
                           uploadResult
                              .text()
                              .then(resolve)
                              .catch((_) => reject(makeError(0, "error while converting to text")));
                        else
                           uploadResult
                              .json()
                              .then((err : any) => {
                                 err.code = uploadResult.status;
                                 reject(err);
                              })
                              .catch((_) => reject(makeError(0, "error while coverting to json")));
                     })
                     .catch((_) => reject(makeError(0, "error with network")));
               })
               .catch((_) => reject(makeError(0, "error while making to binary")));
         })
         .catch((_) => reject(makeError(400, "error while fetching data from URL")));
   });
}

export async function uploadToAlbum(uptokens: string[], album: string, tokens: Tokens) {
   let mediaItems: any = [];
   for (let i in uptokens) {
      let obj = {
         description: "created by CripsyMeme",
         simpleMediaItem: { uploadToken: uptokens[i] },
      };
      mediaItems.push(obj);
   }

   return new Promise((resolve, reject) => {
      fetch("https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate", {
         method: "POST",
         headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${tokens.access_token}`,
         },
         body: JSON.stringify({
            albumId: album,
            newMediaItems: mediaItems,
         }),
      })
         .then((result) => {
            result
               .json()
               .then((resultJSON : any) => {
                  if (resultJSON.error) reject(resultJSON.error);
                  else resolve(resultJSON.newMediaItemResults);
               })
               .catch((_) => reject(makeError(0, "error with json")));
         })
         .catch((_) => reject(makeError(0, "error with network")));
   });
}
