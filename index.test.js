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

// describe('testing neo4j features',()=>{
//     test('test if merge guild is working',() =>{
//         return index.mergeGuild('test',session).then(res=>{
//             const resGID = res.records.map(row => {
//                 return row.get('gID');
//             })
//             expect(resGID[0]).toBe('test');
//         })
//     });

// })

describe('testing queries', ()=>{
    test('test if QueryBuilder build the query properly and run it',async()=>{
        const q = index.queryBuilder("Test Guild","User ID","www.example.com");
        //console.log(q);
        return session.run(q).then(res=>{
            res.records.map(row=>{
                expect(row.get("node").identity.low).toBe(2);
            })
        });
    })
    test('test if QueryBuilder build the query properly and run it',async()=>{
        const q = index.queryBuilder("Test Guild","User ID","www.exaple.com");
        return session.run(q).then(res=>{
            expect(res.records.length).toBe(0);
        });
    })
    //TODO:PUT IN deleteURLByDate
    test('test if outdated URLs gets deleted',async()=>{

    });
})

describe('testing regex',()=>{

    test('test if regex can detect a link',()=>{
        let testMsg = "https://www.MainURL.com/SubURL";
        let res = index.findLink(testMsg)[0];
        expect(res).not.toBe(undefined);
        console.log(res[0]);
    });
})