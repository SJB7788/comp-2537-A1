const app = require('./app')
const mongoose = require('mongoose');
require('dotenv').config();

main().catch(error => console.log(error));

async function main() {
    await mongoose.connect(`mongodb+srv://${process.env.MONGOOSE_USER}:${process.env.MONGOOSE_PASSWORD}@cluster0.0c1wpzp.mongodb.net/comp2537A2?retryWrites=true&w=majority`)

    app.listen(3000, () => {
        console.log("running on port 3000")
    })
}