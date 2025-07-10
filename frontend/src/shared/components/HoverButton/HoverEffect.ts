import gsap from "gsap";

const shapes = [
  "M254 286.11a50 50 0 0050-50H204a50 50 0 0050 50z",
  "M255.5 271a20 20 0 10-20-20 20 20 0 0020 20zm0 30a50 50 0 10-50-50 50 50 0 0050 50z",
  "M248.8 202.17a8 8 0 019.4 0l40.6 29.5a8 8 0 012.9 8.94l-15.5 47.73a8 8 0 01-7.61 5.52h-50.18a8 8 0 01-7.61-5.52l-15.5-47.73a8 8 0 012.9-8.94z"
];

export default function initHoverEffect() {
  const container = document.querySelector(".anim-explode-container") as HTMLElement;
  const svg = container.querySelector(".anim-explode") as SVGSVGElement;
  const numberOfShapes = 15;

  container.addEventListener("mouseenter", () => {
    const animatedShapes: SVGPathElement[] = [];

    for (let i = 0; i < numberOfShapes; i++) {
      const newElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
      newElement.setAttribute("d", gsap.utils.random(shapes));
      newElement.style.fill = gsap.utils.random(["#8EF6E4", "#A2D5F2", "#D59BF6", "#EDB1F1"]);
      svg.appendChild(newElement);
      animatedShapes.push(newElement);
    }

    const killShapes = () => {
      animatedShapes.forEach((shape) => {
        if (svg && shape && svg.contains(shape)) {
          svg.removeChild(shape);
        }
      });
    };

    gsap.set(animatedShapes, {
      transformOrigin: "center",
      scale: "random(0.3, 0.5)"
    });

    gsap.to(animatedShapes, {
      onComplete: killShapes,
      keyframes: [
        {
          rotate: "random(180, -180)",
          x: "random([-100, -80, -120, 120, 80, 100])",
          y: "random([-100, -80, -120, 120, 80, 100])",
          ease: "expo.out",
          duration: 4.5,
          stagger: {
            amount: 0.15
          }
        },
        { opacity: 0, delay: -3.2 }
      ]
    });
  });
}
