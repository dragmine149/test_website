import { tryCatch } from "./utils";
import { Marked } from "marked";

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

class Router {
  tests: Map<string, TestStorage>;
  marked: Marked;

  constructor() {
    this.tests = new Map();
    this.tests.set("root", {
      readme: "",
      document: new Map<string, string>().set("root", document.body.innerHTML)
    });
    this.loadTestList();

    this.marked = new Marked();
    addEventListener("test", (ev) => this.loadTest((ev as CustomEvent).detail))
  }

  endTest() {
    document.body.innerHTML = this.tests.get("root")!.document.get("root")!;

    let url = new URL(location.toString());
    url.searchParams.set("test", "");
    history.pushState(undefined, "", url);
  }

  async getTestFromGithub(test: string) {
    let result = await tryCatch(fetch(`https://raw.githubusercontent.com/dragmine149/test_website/refs/heads/listings/${test}.json`));
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
    let result = await tryCatch(fetch(`https://raw.githubusercontent.com/dragmine149/test_website/refs/heads/main/${test}/${file}`));
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
  }

}

const router = new Router();

export { router };
