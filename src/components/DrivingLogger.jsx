import React, { useState } from "react";
import DatePicker from "react-datepicker";
import { RenderH2 } from "./RenderH2";
import "react-datepicker/dist/react-datepicker.css";

export function DrivingLogger(props) {
  const [startDate, setStartDate] = useState(new Date());
  return (
    <>
      <RenderH2 title="Driving Log" />
      <p>Date Start time End time Conditions Is night Notes</p>
      <DatePicker
        selected={startDate}
        onChange={(date) => setStartDate(date)}
      />
      <input placeholder="Start time" />
      <input placeholder="end time" />
      <select>
        <option>rainy</option>
        <option>rainy</option>
        <option>rainy</option>
        <option>rainy</option>
        <option>rainy</option>
      </select>
      <label>
        <input type="checkbox" />
        Is night
      </label>
      <textarea id="w3review" name="w3review" rows="4" cols="50"></textarea>
    </>
  );
}
