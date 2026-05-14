console.log("Profile JS loaded");

document.querySelector("#editButton").addEventListener("click", editUserInfo);
function editUserInfo() {
  document.getElementById("personalInfoFields").disabled = false;
}