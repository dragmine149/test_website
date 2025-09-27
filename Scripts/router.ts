import { tryCatch } from "./utils";
import { Marked } from "marked";
import { page } from "../../Scripts/loader/page";
import { modules } from "../../Modules/modules";

interface FileStructure {
  files: string[],
  dirs: {
    [x: string]: FileStructure
  }
}

interface TestStorage {
  readme: string,
  document: Map<string, string>
}

const LINK = `https://raw.githubusercontent.com/dragmine149/test_website/refs/heads`;

class Router {
  marked: Marked;
  title: HTMLTitleElement;

  constructor() {
    this.loadTestList();

    this.marked = new Marked();
    this.title = document.getElementById("title") as HTMLTitleElement;
    addEventListener("test", (ev) => this.loadTest((ev as CustomEvent).detail))

    let url = new URL(location.toString());
    let test = url.searchParams.get("test");
    if (test) this.loadTest(test);
  }

  setBrowserDetails(test: string) {
    let url = new URL(location.toString());
    url.searchParams.set("test", test);
    history.pushState(undefined, "", url);

    this.title.textContent = `Drag's Test Suite -> ${test || "Main Page"}`;
  }

  endTest() {
    this.setBrowserDetails("");
    location.reload();
  }

  #buildHeaders() {
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    return headers;
  }

  async getTestFromGithub(test: string) {
    let result = await tryCatch(fetch(`${LINK}/listings/${test}.json`, { cache: "no-cache", headers: this.#buildHeaders() }));
    if (result.error) {
      alert("That test does not exist. Please try a different test.");
      return null;
    }

    if (!result.data.ok) {
      alert("Network request whilst trying to get test. Please see the console for more information");
      console.error(result.data);
      return null;
    }

    let json = await tryCatch<FileStructure>(result.data.json());
    if (json.error) {
      alert("Failed to parse json response. Malformed json?. Please see the console for more information");
      console.error(json);
      return null;
    }

    return json.data;
  }

  async getFileFromGithub(test: string, file: string) {
    let result = await tryCatch(fetch(`${LINK}/main/${test}/${file}`, { cache: "no-cache", headers: this.#buildHeaders() }));
    if (result.error) {
      console.warn("That file does not exist, returning blank to prevent failure");
      return "";
    }
    if (!result.data.ok) {
      console.warn("Network request whilst trying to get test. Please see the console for more information");
      console.warn(result.data);
      return "";
    }

    let text = await tryCatch(result.data.text());
    if (text.error) {
      console.warn("Failed to get text object somehow...")
      console.error(text);
      return "";
    }

    return text.data
  }

  async loadTestList() {
    let root_tests = await this.getTestFromGithub("root");
    if (root_tests == null) return;
    Object.keys(root_tests.dirs).forEach(async (dir) => {
      if (dir.startsWith(".") || dir == "Scripts") return;

      let readme = await this.getFileFromGithub(dir, "readme.md");

      let test_template = document.createElement("button");
      test_template.classList.add("bg-zinc-500", "text-center")
      test_template.onclick = () => dispatchEvent(new CustomEvent("test", { detail: dir }));
      test_template.innerHTML = await this.marked.parse(readme);

      document.getElementById("test_website_results")?.appendChild(test_template);
    })
  }

  async loadTest(test: string) {
    console.log(`Attempting to load ${test}`);
    // this.setBrowserDetails(test);

    let index = await this.getFileFromGithub(test, "export/index.html");
    let dom = new DOMParser()
    let test_doc = dom.parseFromString(index, "text/html");

    await modules.load_elements_from_dom(test_doc.body, `${LINK}/main/${test}/export`);
    let url = new URL(location.toString());
    url.searchParams.set("test", test);
    page.load_page_contents(url, test_doc.body);

    if (!globalThis.initialise) {
      alert("Can't find required initialise function to overwrite `DOMContentLoaded` event!");
      return;
    }

    globalThis.initialise();
  }

}
export { Router };
