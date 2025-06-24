
export async function readKeys(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => {
      const arrayBuffer = event.target.result;
      const utf8 = new TextDecoder("utf-8").decode(arrayBuffer).trim();

      let text = utf8;
      let checksum = null;

      const lastLineIndex = utf8.lastIndexOf('\n');
      const lastLine = lastLineIndex === -1 ? utf8 : utf8.slice(lastLineIndex + 1);
      const match = lastLine.match(/^Checksum:\s*(\d+)$/);

      if (match) {
        checksum = parseInt(match[1], 10);
        text = lastLineIndex === -1 ? '' : utf8.slice(0, lastLineIndex);
      }

      const lines = text.split('\n');
      const array = lines.map(str => {
        const num = parseInt(str, 10);
        return num < 0 ? num + 256 : num;
      });

      // Map numbers to key values
      const uint8ToKeyMap = {
        9: "Tab", 10: "Enter", 27: "Escape", 32: " ", 127: "Backspace",
        128: "Unidentified", 129: "ArrowUp", 130: "ArrowDown", 131: "ArrowRight",
        132: "ArrowLeft", 133: "Home", 134: "End", 137: "Delete"
      };
      const keys = array.map(key => uint8ToKeyMap[key] || key);

      const localChecksum = fletcher16Checksum(text);
      if (!checksum || checksum != localChecksum) {
        reject(new Error(`Key file failed checksum.`));
      }
      if (text.length >= 100000) {
        reject(new Error(`File size (${text.length}) exceeds 100kb max.`));
      }

      resolve({ keys, text });
    };
    reader.readAsArrayBuffer(file);
  });
}

function fletcher16Checksum(text) {
  let sum1 = 0, sum2 = 0;
  const lines = text.split('\n');

  for (const line of lines) {
    for (const char of line) {
      sum1 = (sum1 + char.charCodeAt(0)) % 255;
      sum2 = (sum2 + sum1) % 255;
    }
    sum1 = (sum1 + "\n".charCodeAt(0)) % 255;
    sum2 = (sum2 + sum1) % 255;
  }
  return (sum2 << 8) | sum1;
}


export function rleCompress(text) {
  const values = text.trim().split('\n').map(Number);
  if (values.length === 0) return '';

  const result = [];
  let prev = values[0];
  let count = 1;

  for (let i = 1; i < values.length; i++) {
    const curr = values[i];
    if (curr === prev) {
      count++;
    } else {
      result.push(count === 1 ? `${prev}` : `${prev},${count}`);
      prev = curr;
      count = 1;
    }
  }
  result.push(count === 1 ? `${prev}` : `${prev},${count}`);
  console.log("savings", result.join('\n').length / text.length);
  return result.join('\n');
}

export function rleDecompress(rleText) {
  const lines = rleText.trim().split('\n');
  const result = [];

  for (const line of lines) {
    if (line.includes(',')) {
      const [val, count] = line.split(',').map(Number);
      for (let i = 0; i < count; i++) {
        result.push(val);
      }
    } else {
      result.push(Number(line));
    }
  }

  return result.join('\n');
}