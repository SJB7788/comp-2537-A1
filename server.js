const app = require('./app')
const mongoose = require('mongoose');
require('dotenv').config();

main().catch(error => console.log(error));

async function main() {
    try {
        await mongoose.connect(`mongodb+srv://${process.env.MONGOOSE_USER}:${process.env.MONGOOSE_PASSWORD}@cluster0.0c1wpzp.mongodb.net/${process.env.MONGOOSE_FOLDER}?retryWrites=true&w=majority`)
    } catch (error) {
        console.log(error);
        process.exit(1);
    }

    app.listen(process.env.PORT || 3000, () => {
        console.log("running on port 3000")
    })
}