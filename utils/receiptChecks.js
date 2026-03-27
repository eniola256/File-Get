import crypto from "node:crypto";

import exifr from "exifr";

export const generateImageHash = (buffer) =>
  crypto.createHash("sha256").update(buffer).digest("hex");

export const scanExif = async (buffer) => {
  const suspiciousFlags = [];
  const softFlags = [];

  try {
    const exif = await exifr.parse(buffer, {
      tiff: true,
      exif: true,
      xmp: true,
      icc: false,
      iptc: false,
    });

    if (!exif) {
      // Soft flag only: lots of legitimate screenshots/compressed images have no EXIF.
      softFlags.push("No EXIF metadata found (may have been stripped)");
      return { suspiciousFlags, softFlags };
    }

    const editingSoftware = [
      "adobe",
      "photoshop",
      "lightroom",
      "gimp",
      "affinity",
      "pixelmator",
      "snapseed",
      "picsart",
      "canva",
    ];

    const rawSoftware =
      exif.Software || exif.ProcessingSoftware || exif.HistorySoftwareAgent || "";
    const softwareField = rawSoftware.toString().toLowerCase();

    const matchedSoftware = editingSoftware.find((value) =>
      softwareField.includes(value),
    );
    if (matchedSoftware) {
      suspiciousFlags.push(
        `Editing software detected in metadata: ${rawSoftware.toString()}`,
      );
    }

    if (exif.DateTimeOriginal && exif.ModifyDate) {
      const original = new Date(exif.DateTimeOriginal);
      const modified = new Date(exif.ModifyDate);
      if (
        !Number.isNaN(original.valueOf()) &&
        !Number.isNaN(modified.valueOf()) &&
        modified > original
      ) {
        suspiciousFlags.push(
          `Image modified after original capture - original: ${original.toISOString()}, modified: ${modified.toISOString()}`,
        );
      }
    }

    if (exif.ModifyDate) {
      const modified = new Date(exif.ModifyDate);
      if (!Number.isNaN(modified.valueOf()) && modified > new Date()) {
        suspiciousFlags.push(
          "Image has a future modification timestamp - likely tampered",
        );
      }
    }
  } catch {
    // Soft flag only: parsing failures can be caused by unusual encodings or library limits.
    softFlags.push("EXIF parsing failed (metadata may be corrupted or non-standard)");
  }

  return { suspiciousFlags, softFlags };
};

export const scanVisual = (buffer, mimetype) => {
  const flags = [];

  if (mimetype === "image/jpeg") {
    const sig = buffer.slice(0, 2).toString("hex");
    if (sig !== "ffd8") {
      flags.push(`File signature mismatch - declared as ${mimetype}`);
    }
  } else if (mimetype === "image/png") {
    const sig = buffer.slice(0, 4).toString("hex");
    if (sig !== "89504e47") {
      flags.push(`File signature mismatch - declared as ${mimetype}`);
    }
  } else if (mimetype === "image/webp") {
    // WebP needs RIFF at bytes 0-3 AND WEBP at bytes 8-11.
    const riff = buffer.slice(0, 4).toString("hex") === "52494646";
    const webp = buffer.slice(8, 12).toString("ascii") === "WEBP";
    if (!riff || !webp) {
      flags.push(
        `File signature mismatch - declared as ${mimetype} (expected RIFF....WEBP header)`,
      );
    }
  }

  const sizeKB = buffer.length / 1024;
  if (sizeKB < 20) {
    flags.push(
      `Image is unusually small (${sizeKB.toFixed(1)}KB) - may not be a real receipt`,
    );
  }

  return flags;
};

export const runReceiptChecks = async (buffer, mimetype) => {
  const [exifResult, visualFlags] = await Promise.all([
    scanExif(buffer),
    Promise.resolve(scanVisual(buffer, mimetype)),
  ]);

  const exifSuspiciousFlags = exifResult?.suspiciousFlags || [];
  const exifSoftFlags = exifResult?.softFlags || [];

  return {
    exifSuspicious: exifSuspiciousFlags.length > 0,
    visuallySuspicious: visualFlags.length > 0,
    flagDetails: [...exifSuspiciousFlags, ...visualFlags, ...exifSoftFlags],
  };
};

