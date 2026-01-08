export interface Message {
  role: 'user' | 'model';
  content: string;
}

// FIX: Add 'Location' type to resolve import error in components/MapView.tsx.
export interface Location {
  lat: number;
  lng: number;
}

// FIX: Add 'Place' type to resolve import error in components/MapView.tsx.
export interface Place {
  location: Location;
  title: string;
}

// FIX: Add 'RideStatus' type to resolve import error in components/StatusBar.tsx.
export type RideStatus = 'IDLE' | 'REQUESTING' | 'EN_ROUTE' | 'IN_PROGRESS';

// FIX: Add 'Driver' type to resolve import error in components/DriverCard.tsx.
export interface Driver {
  name: string;
  avatar: string;
  rating: number;
  car: {
    model: string;
    licensePlate: string;
  };
}
