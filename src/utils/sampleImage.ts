/**
 * Programmatically generates a highly polished sample image with a solid white background
 * so that users can instantly test the background removal features.
 * Features a cute stylized character with sunglasses, mimicking the user's uploaded asset style!
 */
export function generateSampleImage(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = 600;
  const h = 600;
  canvas.width = w;
  canvas.height = h;

  // 1. Fill solid white background (the target to remove)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);

  // 2. Draw some background accents on the canvas to make it a cute composition
  // We'll draw some soft colorful circle glows *behind* the character, but within bounds, 
  // keeping the outermost background pristine solid white.
  const gradientBg = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, 250);
  gradientBg.addColorStop(0, '#fef3c7'); // Amber 100
  gradientBg.addColorStop(0.5, '#fae8ff'); // Fuchsia 100
  gradientBg.addColorStop(1, '#ffffff'); // Fades to solid white
  ctx.fillStyle = gradientBg;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 260, 0, Math.PI * 2);
  ctx.fill();

  // 3. Draw a stylized character body / jacket (yellowish, matching user style)
  ctx.save();
  ctx.translate(w / 2, h / 2 + 100);

  // Shoulder and jacket
  const jacketGrad = ctx.createLinearGradient(-150, 0, 150, 180);
  jacketGrad.addColorStop(0, '#fef08a'); // yellow-200
  jacketGrad.addColorStop(0.5, '#fde047'); // yellow-300
  jacketGrad.addColorStop(1, '#ca8a04'); // yellow-600
  ctx.fillStyle = jacketGrad;
  
  ctx.beginPath();
  ctx.moveTo(-150, 200);
  ctx.quadraticCurveTo(-140, 40, -60, 30);
  ctx.lineTo(60, 30);
  ctx.quadraticCurveTo(140, 40, 150, 200);
  ctx.closePath();
  ctx.fill();

  // Purple shirt underneath
  const shirtGrad = ctx.createLinearGradient(-40, 40, 40, 150);
  shirtGrad.addColorStop(0, '#c084fc'); // purple-400
  shirtGrad.addColorStop(1, '#818cf8'); // indigo-400
  ctx.fillStyle = shirtGrad;
  ctx.beginPath();
  ctx.moveTo(-50, 31);
  ctx.lineTo(50, 31);
  ctx.quadraticCurveTo(60, 120, 0, 150);
  ctx.quadraticCurveTo(-60, 120, -50, 31);
  ctx.closePath();
  ctx.fill();

  // Yellow collar details
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-60, 30);
  ctx.lineTo(-20, 60);
  ctx.lineTo(0, 30);
  ctx.lineTo(20, 60);
  ctx.lineTo(60, 30);
  ctx.stroke();

  ctx.restore();

  // 4. Draw character face & neck
  ctx.save();
  ctx.translate(w / 2, h / 2);

  // Neck
  ctx.fillStyle = '#fed7aa'; // light warm skin tone
  ctx.beginPath();
  ctx.moveTo(-35, 30);
  ctx.lineTo(35, 30);
  ctx.lineTo(40, 110);
  ctx.lineTo(-40, 110);
  ctx.closePath();
  ctx.fill();

  // Neck shadow
  ctx.fillStyle = '#ffedd5';
  ctx.beginPath();
  ctx.moveTo(-35, 30);
  ctx.lineTo(35, 30);
  ctx.lineTo(25, 75);
  ctx.lineTo(-25, 75);
  ctx.closePath();
  ctx.fill();

  // Face Oval
  ctx.fillStyle = '#ffedd5'; // Skin color
  ctx.beginPath();
  ctx.arc(0, -20, 95, 0, Math.PI * 2);
  ctx.fill();

  // Checks blushed
  const blushGrad = ctx.createRadialGradient(-50, -10, 0, -50, -10, 35);
  blushGrad.addColorStop(0, 'rgba(244, 63, 94, 0.45)');
  blushGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
  ctx.fillStyle = blushGrad;
  ctx.beginPath();
  ctx.arc(-50, -10, 35, 0, Math.PI * 2);
  ctx.fill();

  const blushGrad2 = ctx.createRadialGradient(50, -10, 0, 50, -10, 35);
  blushGrad2.addColorStop(0, 'rgba(244, 63, 94, 0.45)');
  blushGrad2.addColorStop(1, 'rgba(244, 63, 94, 0)');
  ctx.fillStyle = blushGrad2;
  ctx.beginPath();
  ctx.arc(50, -10, 35, 0, Math.PI * 2);
  ctx.fill();

  // Eyes (elegant anime style, looking sideway)
  ctx.fillStyle = '#1e1b4b';
  // Left eye
  ctx.beginPath();
  ctx.arc(-40, -30, 8, 0, Math.PI, true);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#1e1b4b';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-38, -32, 4, 0, Math.PI * 2);
  ctx.fill();
  // Eyebrow
  ctx.strokeStyle = '#431407';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(-42, -45, 15, Math.PI * 1.1, Math.PI * 1.8);
  ctx.stroke();

  // Right eye - looking side
  ctx.beginPath();
  ctx.arc(40, -30, 8, 0, Math.PI, true);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(42, -32, 4, 0, Math.PI * 2);
  ctx.fill();
  // Eyebrow
  ctx.beginPath();
  ctx.arc(42, -45, 15, Math.PI * 1.2, Math.PI * 1.9);
  ctx.stroke();

  // Cute nose
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-1, -17);
  ctx.quadraticCurveTo(2, -15, 3, -10);
  ctx.stroke();

  // Gentle pink smile
  ctx.strokeStyle = '#be185d';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 15, 12, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();

  // 5. Short Black Hair (framed nicely, matching user's reference)
  ctx.fillStyle = '#111827'; // Dark charcoal hair
  // Hair back / bob
  ctx.beginPath();
  ctx.arc(0, -35, 120, Math.PI * 0.9, Math.PI * 2.1);
  ctx.quadraticCurveTo(125, 40, 110, 80);
  ctx.quadraticCurveTo(80, 20, 80, -20);
  ctx.lineTo(-80, -20);
  ctx.quadraticCurveTo(-80, 20, -110, 80);
  ctx.quadraticCurveTo(-125, 40, -120, -35);
  ctx.fill();

  // Hair bangs
  ctx.beginPath();
  ctx.moveTo(-110, -50);
  ctx.quadraticCurveTo(-80, -110, 0, -105);
  ctx.quadraticCurveTo(70, -110, 110, -50);
  ctx.quadraticCurveTo(90, -90, 0, -85);
  ctx.quadraticCurveTo(-90, -90, -110, -50);
  ctx.closePath();
  ctx.fill();

  // Hair strands on sides
  ctx.beginPath();
  ctx.moveTo(-105, -30);
  ctx.quadraticCurveTo(-115, 30, -95, 75);
  ctx.quadraticCurveTo(-90, 85, -85, 70);
  ctx.quadraticCurveTo(-90, 30, -90, -20);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(105, -30);
  ctx.quadraticCurveTo(115, 30, 95, 75);
  ctx.quadraticCurveTo(90, 85, 85, 70);
  ctx.quadraticCurveTo(90, 30, 90, -20);
  ctx.closePath();
  ctx.fill();

  // 6. Sunglasses resting on head (This gives white elements as well, like the sunglasses lenses!)
  ctx.translate(0, -110);
  ctx.rotate(-0.06);

  // Sunglasses gold frame link
  ctx.strokeStyle = '#fbbf24'; // beautiful gold
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-50, 0);
  ctx.quadraticCurveTo(0, 15, 50, 0);
  ctx.stroke();

  // Left lens frame
  ctx.beginPath();
  ctx.arc(-42, 5, 26, 0, Math.PI * 2);
  ctx.fillStyle = '#fbbf24';
  ctx.fill();
  ctx.fillStyle = '#e2e8f0'; // Light grey/white lens inside!
  ctx.beginPath();
  ctx.arc(-42, 5, 22, 0, Math.PI * 2);
  ctx.fill();
  // Lens gradient fill
  const lensGrad = ctx.createLinearGradient(-60, -15, -24, 25);
  lensGrad.addColorStop(0, '#38bdf8'); // sky-400
  lensGrad.addColorStop(0.5, '#ec4899'); // dark pink
  lensGrad.addColorStop(1, '#1e1b4b'); // deep indigo
  ctx.fillStyle = lensGrad;
  ctx.beginPath();
  ctx.arc(-42, 5, 20, 0, Math.PI * 2);
  ctx.fill();
  // Lens reflex (white! This is perfect for testing Restore brush)
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.ellipse(-48, -1, 12, 4, Math.PI * 0.25, 0, Math.PI * 2);
  ctx.fill();

  // Right lens frame
  ctx.beginPath();
  ctx.arc(42, 5, 26, 0, Math.PI * 2);
  ctx.fillStyle = '#fbbf24';
  ctx.fill();
  ctx.fillStyle = '#e2e8f0'; // Light grey/white lens
  ctx.beginPath();
  ctx.arc(42, 5, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = lensGrad;
  ctx.beginPath();
  ctx.arc(42, 5, 20, 0, Math.PI * 2);
  ctx.fill();
  // Lens reflex
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.ellipse(36, -1, 12, 4, Math.PI * 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // 7. Text Label banner at the bottom (pure vector look, simple text)
  ctx.save();
  ctx.fillStyle = '#4f46e5'; // Purple badge
  ctx.beginPath();
  ctx.roundRect(w / 2 - 120, h - 60, 240, 36, 18);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF'; // White text! (Also a great white element testing edge thresholds)
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SAMPLE IMAGE 示例图片', w / 2, h - 42);
  ctx.restore();
}
