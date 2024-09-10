import CreateUser from "./createUser";

export async function createUserExcel(taxCode, dataArray) {
  for (let i = 0; i < dataArray.length; i++) {
    const [ma_dt, password] = dataArray[i];
    const userInfo = {
      mst: taxCode,
      ma_dt: ma_dt,
      username: ma_dt,
      password: password.toString(),
      email: "",
    };

    try {
      const response = await CreateUser(taxCode, userInfo);
      if (response.data) {
        console.log(`User created successfully for ${ma_dt}`, response.data);
      } else {
        console.error(`Failed to create user for ${ma_dt}`);
      }
    } catch (error) {
      console.error(`Error creating user for ${ma_dt}:`, error);
    }
  }
}
