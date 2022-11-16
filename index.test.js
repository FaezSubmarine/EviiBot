const index = require('./index')
import neo4j,{int} from 'neo4j-driver';

//const  mockSession = neo4j.driver('neo4j://localhost:7687',neo4j.auth.basic('neo4j', 'FuckYou1')).session();

let driver = null;
let session = null;

beforeAll(()=>{
    driver = neo4j.driver('neo4j://localhost:7687',neo4j.auth.basic('neo4j', 'FuckYou1'));
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
    // test('test if regex grouped the link',()=>{
    //     let testMsg = "https://www.MainURL.com/SubURL";
    //     let res = index.findLink(testMsg)[0];
    //     expect(res.groups["MainURL"]).toBe("https://www.MainURL.com");
    //     expect(res.groups["SubURL"]).toBe("/SubURL");
    // })



    // test('test if regex does not group the sub URL',()=>{
    //     let testMsg = "https://www.MainURL.com";
    //     let res = index.findLink(testMsg)[0];
    //     expect(res.groups["MainURL"]).toBe("https://www.MainURL.com");
    //     expect(res.groups["SubURL"]).toBe("");
    // })
})