import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { driving } from "./pages/driving.js";
import {not_found} from "./pages/not_found.js";
export const Routes = () => {
  return (
    <Router>
      <Switch>
        {/* <Route path="/">
          <driving />
        </Route> */}
        <Route path="/driving:lrndrv">
          <driving />
        </Route>
        <Route>
          <not_found />
        </Route>
      </Switch>
    </Router>
  );
};
