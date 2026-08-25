// Table — shadcn/ui, restyled to BRAND.md.
// Header row is the label mono (§7); rows are separated by hairlines (§9).
// `numeric` on a cell switches it to the JetBrains body face and right-aligns
// it, so figures line up (D-08: mono bodies are for things you read in bulk).
import * as React from "react";

import { cn } from "@/lib/utils";
import "@/styles/components.css";

const Table = React.forwardRef(function Table({ className, ...props }, ref) {
  return (
    <div data-slot="table-container" className="on-table-wrap">
      <table data-slot="table" className={cn("on-table", className)} ref={ref}
      {...props} />
    </div>
  );
});

const TableHeader = React.forwardRef(function TableHeader({ className, ...props }, ref) {
  return <thead data-slot="table-header" className={className} ref={ref}
      {...props} />;
});

const TableBody = React.forwardRef(function TableBody({ className, ...props }, ref) {
  return <tbody data-slot="table-body" className={className} ref={ref}
      {...props} />;
});

const TableRow = React.forwardRef(function TableRow({ className, ...props }, ref) {
  return <tr data-slot="table-row" className={className} ref={ref}
      {...props} />;
});

const TableHead = React.forwardRef(function TableHead({ className, numeric = false, ...props }, ref) {
  return (
    <th data-slot="table-head" data-numeric={numeric ? "true" : undefined} className={className} ref={ref}
      {...props} />
  );
});

const TableCell = React.forwardRef(function TableCell({ className, numeric = false, ...props }, ref) {
  return (
    <td data-slot="table-cell" data-numeric={numeric ? "true" : undefined} className={className} ref={ref}
      {...props} />
  );
});

const TableCaption = React.forwardRef(function TableCaption({ className, ...props }, ref) {
  return <caption data-slot="table-caption" className={className} ref={ref}
      {...props} />;
});

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption };
