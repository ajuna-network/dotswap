/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        "unbounded-variable": ["UnboundedVariable", "sans-serif"],
        "titillium-web": ["TitilliumWeb", "sans-serif"],
        "fira-sans": ["Fira Sans", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      colors: {
        primary: {
          500: "#E6007A",
        },
        dark: {
          100: "rgba(243, 245, 251, 0.4)",
          200: "rgba(0, 0, 0, 0.3)",
          300: "rgba(0, 0, 0, 0.7)",
          400: "rgba(0, 0, 0, 0.9)",
          450: "#000000B2",
          500: "#232735",
        },
        pink: {
          DEFAULT: "#E6007A",
        },
        red: {
          900: "#D50B3E",
        },
        ghost: {
          100: "#E6007A1A",
          200: "#E6007A33",
        },
        blue: {
          900: "#0075AD",
        },
        purple: {
          50: "#FBFCFE",
          100: "#F3F5FB",
          200: "#E6EAF6",
          300: "#DAE0F2",
          400: "#6331F5",
          500: "#6D3AEE",
          600: "#442299",
          700: "#321D47",
          800: "#28123E",
          900: "#1C0533",
          925: "#160527",
          950: "#140523",
        },
        cyan: {
          500: "#00B2FF",
          600: "#00A6ED",
          700: "#0094D4",
        },
        green: {
          100: "#EEFBF4",
          500: "#56F39A",
          600: "#51E591",
          700: "#48CC81",
          900: "#17663A",
        },
        lime: {
          500: "#D3FF33",
          600: "#BEE52E",
          700: "#A9CC29",
        },
        yellow: {
          100: "#FFF9E9",
        },
        gray: {
          5: "#EDEFF2",
          10: "#FFFFFF4D",
          50: "#0000000F",
          100: "#00000059",
          200: "#00000080",
          300: "#000000B2",
          400: "#000000E5",
          500: "#EDEFF2",
        },
        warning: "#FFF9E9",
        alert: "#F53D6B",
        success: "#2DCA72",
        "gradient-half-gray": "linear-gradient(to bottom, white 50%, #FBFCFE 50%);",
      },
      backgroundImage: {
        "placeholder-tokens": "linear-gradient(90deg, #F1EFEF -24.18%, #F9F8F8 50.26%, #E7E5E5 114.84%)",
      },
      boxShadow: {
        "modal-box-shadow":
          "0px 0px 0px 0px rgba(226, 228, 233, 0.10), 3px 12px 27px 0px rgba(226, 228, 233, 0.10), 13px 48px 50px 0px rgba(226, 228, 233, 0.09), 29px 108px 67px 0px rgba(226, 228, 233, 0.05), 52px 193px 80px 0px rgba(226, 228, 233, 0.01), 82px 301px 87px 0px rgba(226, 228, 233, 0.00)",
        "toaster-box-shadow":
          "52px 193px 80px rgba(226, 228, 233, 0.01), 29px 108px 67px rgba(226, 228, 233, 0.05), 13px 48px 50px rgba(226, 228, 233, 0.09), 3px 12px 27px rgba(226, 228, 233, 0.1), 0px 0px 0px rgba(226, 228, 233, 0.1);",
      },
      fontSize: {
        "heading-1": "48px",
        "heading-2": "40px",
        "heading-3": "33px",
        "heading-4": "28px",
        "heading-5": "23px",
        "heading-6": "19px",
        "extra-large": "18px",
        large: "16px",
        medium: "13px",
        small: "11px",
      },
      borderRadius: {
        medium: "100px",
      },
      translate: {
        toasters: "104px",
      },
      minWidth: {
        modal: "450px",
      },
      maxWidth: {
        notification: "280px",
      },
    },
  },
  plugins: [],
};
