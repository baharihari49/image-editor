export default function ImageEditorLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <div className="image-editor-layout">
        {children}
      </div>
    );
  }