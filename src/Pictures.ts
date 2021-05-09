import * as discord from "discord.js";
import * as rethink from "rethinkdb-ts";
import { isRethinkDBError } from "rethinkdb-ts";
import config from "./config";

export interface IPicture {
  link: string;
  author_tag?: string;
  guild_id: string;
  album_name: string;
  created_on?: Date;
}

function between(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}

function isIPicture(pic: unknown): pic is IPicture {
  return typeof pic == "object" && pic["link"] && pic["album_name"];
}

export class PictureManager {
  conn: rethink.Connection;
  table?: rethink.RTable<IPicture>;
  ready: Promise<void>;

  constructor(conn: rethink.Connection) {
    this.conn = conn;
    this.ready = this.ensureTable();
  }

  private async ensureTable() {
    try {
      await rethink.r.dbCreate(config.db.name).run(this.conn);
    } catch (err) {
      if (isRethinkDBError(err) && err.type == rethink.RethinkDBErrorType.OP_FAILED) {
        console.log("DB exists");
      } else {
        throw err;
      }
    }

    let db = rethink.r.db(config.db.name);

    try {
      await db.tableCreate(config.db.table_name).run(this.conn);
    } catch (err) {
      if (isRethinkDBError(err) && err.type == rethink.RethinkDBErrorType.OP_FAILED) {
        console.log("table exists");
      } else {
        throw err;
      }
    }
    this.table = db.table(config.db.table_name);
    return;
  }

  public async seed() {
    const link = "https://pbs.twimg.com/media/E04Q34PUYAEAGtF.jpg";

    let res = await this.table.filter((row) => row("link").eq(link)).run(this.conn);

    if (!res.length) {
      await this.add({
        link,
        album_name: "seed",
        guild_id: "any",
      });
      console.log("seed complete");
    }

    await this.draw("any", "seed");
  }

  public async add(pic: IPicture) {
    if (!isIPicture(pic)) {
      throw Error("PictureManager::add: pic is not an picture");
    }

    if (!pic.created_on) {
      pic.created_on = new Date();
    }
    console.log("adding:");
    console.log(pic);

    await this.ready;
    await this.table.insert(pic).run(this.conn);
    console.log("added pic");
  }

  public async draw(guild_id: string, album_name: string): Promise<IPicture | null> {
    await this.ready;
    let res = await this.table.filter({ guild_id, album_name }).sample(1).run(this.conn);
    console.log("drawn:");
    console.log(res);
    return res.length ? res[0] : null;
  }
}
