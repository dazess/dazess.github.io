# dazess.github.io
<!DOCTYPE html>
<html>
<head>
  <title>Daily Excerpt</title>
  <style>
    body { font-family: Arial; text-align: center; padding: 20px; }
  </style>
</head>
<body>
  <div id="excerpt"></div>
  <script>
    const excerpts = [
      "Excerpt 1: The journey begins.",
      "Excerpt 2: A spark of inspiration.",
      "Excerpt 3: Courage in the face of fear.",
      "Excerpt 4: Wisdom from the past.",
      "Excerpt 5: Embrace the unknown."
    ];
    const today = new Date();
    const index = today.getDate() % excerpts.length;
    document.getElementById("excerpt").innerText = excerpts[index];
  </script>
</body>
</html>
