function togglePassword() {
  let passEl = document.getElementById("password");
  if (passEl.type === "password") {
    passEl.type = "text";
  } else {
    passEl.type = "password";
  }
}
