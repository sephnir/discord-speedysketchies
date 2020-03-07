import DbManager from "./dbManager";
import EpManager from "./epManager";
import BotManager from "./botManager";

const dbManager = new DbManager();
const botManager = new BotManager();
const epManager = new EpManager(botManager);
