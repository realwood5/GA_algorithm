// src/types/types.ts

export type NewPictureReq = {
    name: string;
    picture_data: string[][];
  };
  
  
  export type NewPictureRes = {
    failed: boolean;
    picture_id: string;
  };
  
  export type ErrorResponse = {
    message: string;
    errorCode: string;
  };
  