export interface ColourOption {
    readonly value: string;
    readonly label: string;
    readonly color: string;
    readonly isFixed?: boolean;
    readonly isDisabled?: boolean;
  }

  export const colourOptions: readonly ColourOption[] = [
    { value: 'ocean', label: 'Ocean', color: '#00B8D9', isFixed: true },
    { value: 'blue', label: 'Blue', color: '#0052CC', isDisabled: true },
    { value: 'purple', label: 'Purple', color: '#5243AA' },
    { value: 'red', label: 'Red', color: '#FF5630', isFixed: true },
    { value: 'orange', label: 'Orange', color: '#FF8B00' },
    { value: 'yellow', label: 'Yellow', color: '#FFC400' },
    { value: 'green', label: 'Green', color: '#36B37E' },
    { value: 'forest', label: 'Forest', color: '#00875A' },
    { value: 'slate', label: 'Slate', color: '#253858' },
    { value: 'silver', label: 'Silver', color: '#666666' },
  ];

  export interface FlavourOption {
    readonly value: string;
    readonly label: string;
    readonly rating: string;
  }

  export const flavourOptions: readonly FlavourOption[] = [
    { value: 'vanilla', label: 'Vanilla', rating: 'safe' },
    { value: 'chocolate', label: 'Chocolate', rating: 'good' },
    { value: 'strawberry', label: 'Strawberry', rating: 'wild' },
    { value: 'salted-caramel', label: 'Salted Caramel', rating: 'crazy' },
  ];

  export interface StateOption {
    value: string;
    label: string;
  }

  export const options: StateOption[] = [
    { value: '', label: '' },
  ];

  export const optionLength = [
    { value: 1, label: 'general' },
    {
      value: 2,
      label:
        'Evil is the moment when I lack the strength to be true to the Good that compels me.',
    },
    {
      value: 3,
      label:
        "It is now an easy matter to spell out the ethic of a truth: 'Do all that you can to persevere in that which exceeds your perseverance. Persevere in the interruption. Seize in your being that which has seized and broken you.",
    },
  ];

  export const dogOptions = [
    { id: 1, label: 'Chihuahua' },
    { id: 2, label: 'Bulldog' },
    { id: 3, label: 'Dachshund' },
    { id: 4, label: 'Akita' },
  ];

  // let bigOptions = [];
  // for (let i = 0; i < 10000; i++) {
  // 	bigOptions = bigOptions.concat(colourOptions);
  // }

  export interface GroupedOption {
    readonly label: string;
    readonly options: readonly ColourOption[] | readonly FlavourOption[];
  }

  export const groupedOptions: readonly GroupedOption[] = [
    {
      label: 'Colours',
      options: colourOptions,
    },
    {
      label: 'Flavours',
      options: flavourOptions,
    },
  ];
