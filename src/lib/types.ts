export interface NFTAttributes {
    traitTypeOne: string;
    valueOne: string;
    traitTypeTwo: string;
    valueTwo: string;
  }
  
export interface NFTData {
    name: string;
    description: string;
    symbol: string;
    image: string;
    link: string;
  }
  
export interface ErrorResponse {
    message: string;
    response?: {
      data: unknown;
    };
  }