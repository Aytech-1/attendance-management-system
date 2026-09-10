export interface People {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phoneNumber?: number;
  email?: string;
  homeAddress: string;
  nin: number;
  lga: {
    lgaId: number;
    lgaName: string;
  };
  gender?: {
    genderId: number;
    genderName: string;
  } | string;
  title?: {
    titleId: number;
    titleName: string;
  } | string;
  status?: {
    statusId: number;
    statusName: string;
  } | string;
}

export type WeatherData = {
  hourly: {
    time: string[];
    temperature_2m: number[];
  };
};

export interface User extends People {
  id?: number;
  userId?: string;
  name?: string;
  role?: string;
  profile?: any;
  email?: string;
}

export interface Staff extends People {
  staffId?: string;
}