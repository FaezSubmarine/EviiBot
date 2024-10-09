const index = require('./index')
import neo4j,{int} from 'neo4j-driver';
const { token, URI, user, password } = require("./config.json");

let driver = null;
let session = null;

beforeAll(()=>{
    driver = neo4j.driver(URI,neo4j.auth.basic(user, password));
    session = driver.session();
});

afterAll(()=>{
    session.close();
})