const generatePassword = (length = 10) => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };
  
  const generateEmail = (fullName) => {
    const base = fullName.toLowerCase().replace(/\s+/g, ".");
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `${base}${randomNum}@smartgate.com`;
  };
  
  export { generatePassword, generateEmail };
  