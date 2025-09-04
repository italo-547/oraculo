export declare const optionsDiagnosticar: (
  | {
      flags: string;
      desc: string;
      defaultValue?: undefined;
      parser?: undefined;
    }
  | {
      flags: string;
      desc: string;
      defaultValue: boolean;
      parser?: undefined;
    }
  | {
      flags: string;
      desc: string;
      parser: (val: string, prev: string[]) => string[];
      defaultValue: string[];
    }
)[];
//# sourceMappingURL=options-diagnosticar.d.ts.map
