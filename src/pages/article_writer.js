import { TopBar } from "./top_bar";
import React from "react";
import { Helmet } from "react-helmet";
import "../Home.css";

export const ArticleWriter = () => {
  return (
    <div>
      <Helmet>
        <link
          rel="stylesheet"
          href="https://pyscript.net/releases/2024.10.1/core.css"
        />
        <script
          type="module"
          src="https://pyscript.net/releases/2024.10.1/core.js"
        ></script>
      </Helmet>
      <py-config></py-config>
      <py-script>print('Hello, World!')</py-script>
      {/* <input
        type="text"
        id="product"
        placeholder="type product here"
        style={{ marginTop: "100px" }}
      />
      <button py-click="main">Submit</button>
      <div id="output"></div>
      <script
        type="py"
        src="../article_writer_stuff/call_openai.py"
        config="src\article_writer_stuff\pyscript.toml"
      />
      <TopBar /> */}
    </div>
  );
};
