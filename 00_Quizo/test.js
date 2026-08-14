const mongoose = require("mongoose");

mongoose.connect(
"mongodb+srv://gauravsuryawanshi9999_db_user:GK143%402023@quizo.gzvfdzz.mongodb.net/quizo?retryWrites=true&w=majority&appName=Quizo"
)
.then(() => {
    console.log("✅ CONNECTED");
    process.exit(0);
})
.catch(err => {
    console.error(err);
    process.exit(1);
});