import createDomPurify from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const dataSanitizer = createDomPurify(window);

export default dataSanitizer;
