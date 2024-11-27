import { User } from './interfaces';
import dotenv from "dotenv";

dotenv.config();
// utils/fetchUsers.ts
const API_URL = process.env.REACT_APP_API_BASE_URL;
const fetchUsersData = async (userToken: string) => {
  if (!userToken) {
    throw new Error('User token is required');
  }

  try {
    const response = await fetch(
      `${API_URL}/users`,
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    const data: User[] = await response.json();
    return data; // Return the raw user data
  } catch (error) {
    console.error(error);
    throw new Error('Error fetching users. Please try again later.');
  }
};

export default fetchUsersData;
