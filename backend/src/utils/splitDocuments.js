export function splitDocuments(markdown) {
  if (!markdown) {
    return { readme: "", developerGuide: "" };
  }

  // Normalize line endings
  const content = markdown.replace(/\r\n/g, "\n");

  // Match README section
  const readmeMatch = content.match(
    /^#{1,3}\s*README\.md[\s\S]*?(?=^#{1,3}\s*DEVELOPER_GUIDE\.md)/m
  );

  // Match Developer Guide section
  const devMatch = content.match(
    /^#{1,3}\s*DEVELOPER_GUIDE\.md[\s\S]*/m
  );

  return {
    readme: readmeMatch ? readmeMatch[0].trim() : "",
    developerGuide: devMatch ? devMatch[0].trim() : ""
  };
}