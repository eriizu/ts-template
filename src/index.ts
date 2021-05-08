function hello() {
  console.log("hello");
}

hello();

interface user {
  name: string;
  gender: string;
}

import { r, RDatum, RTable, RethinkDBError, RethinkDBErrorType } from "rethinkdb-ts";

function isRethinkDBError(x: any): x is RethinkDBError {
  return typeof x.type == "number";
}

r.connect({ server: { host: "127.0.0.1", port: 49154 } })
  .catch(() => {
    console.log("couldn't connect but that's expected");
  })
  .then(async (conn) => {
    console.log("it worked");

    if (conn) {
      // console.log(conn);
      try {
        await r.db("test").tableCreate("users").run(conn);
      } catch (err) {
        if (isRethinkDBError(err)) {
          if (err.type == RethinkDBErrorType.OP_FAILED) console.log("already exists");
        }
      }
      let table: RTable<user> = r.db("test").table("users");

      let tmp: user = {
        name: "Douce",
      };

      await table.insert({ name: "Élise", gender: "no" }).run(conn);
      await table.insert({ name: "Potate", gender: "probably" }).run(conn);
      await table.insert({ name: "Douce" }).run(conn);

      let users = await table
        // .table<RDatum<{ name: string; gender: string }>>("prout")
        .filter((doc) => doc("name").eq("Élise"))
        .run(conn);

      console.log(users);

      conn.close().then(() => {
        console.log("closed");
      });
    }
  });
