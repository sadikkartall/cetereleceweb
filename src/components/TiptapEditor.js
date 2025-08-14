import React, { useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import CodeBlock from '@tiptap/extension-code-block';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Blockquote from '@tiptap/extension-blockquote';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { storage } from '../firebase/config';
import { uploadBytes, getDownloadURL, ref as storageRef } from 'firebase/storage';
import './TiptapEditor.css';

const MenuBar = ({ editor }) => {
  const fileInputRef = useRef();
  if (!editor) return null;

  // Görsel yükleme ve ekleme
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const fileRef = storageRef(storage, `editor-images/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    editor.chain().focus().setImage({ src: url }).run();
    event.target.value = '';
  };

  return (
    <div className="tiptap-menubar">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}><b>B</b></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}><i>I</i></button>
      <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'is-active' : ''}><u>U</u></button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''}><s>S</s></button>
      <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={editor.isActive('highlight') ? 'is-active' : ''}>A</button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}>H1</button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}>H2</button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}>H3</button>
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''}>• Liste</button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''}>1. Liste</button>
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'is-active' : ''}>&ldquo;</button>
      <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor.isActive('codeBlock') ? 'is-active' : ''}>{'<>'}</button>
      <button onClick={() => editor.chain().focus().setHorizontalRule().run()}>—</button>
      <button onClick={() => editor.chain().focus().undo().run()}>Geri</button>
      <button onClick={() => editor.chain().focus().redo().run()}>İleri</button>
      <button onClick={() => fileInputRef.current.click()}>Görsel</button>
      <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImageUpload} />
      <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}>Sol</button>
      <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}>Orta</button>
      <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}>Sağ</button>
      <button onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''}>Yasla</button>
      <button onClick={() => {
        const url = prompt('Bağlantı (URL) girin:');
        if (url) editor.chain().focus().setLink({ href: url, target: '_blank' }).run();
      }}>Bağlantı</button>
      <button onClick={() => editor.chain().focus().unsetLink().run()}>Bağlantıyı Kaldır</button>
      <button onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>Tablo</button>
    </div>
  );
};

const TiptapEditor = React.forwardRef(({ value = '', onChange, placeholder = 'Blog yazınızı buraya yazın...' }, ref) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight,
      Blockquote,
      CodeBlock,
      Image.configure({
        HTMLAttributes: {
          class: 'resizable-image',
        },
      }),
      Link,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      if (onChange) onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
    },
  });

  // Ref ile dışarıya getContent fonksiyonu sun
  React.useImperativeHandle(ref, () => ({
    getContent: () => editor?.getHTML() || ''
  }), [editor]);

  useEffect(() => {
    if (editor && value && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
    // eslint-disable-next-line
  }, [value]);

  return (
    <div>
      <MenuBar editor={editor} />
      <EditorContent
        editor={editor}
        style={{
          color: '#222',
          background: '#fff',
          borderRadius: 8,
          transition: 'background 0.3s, color 0.3s',
        }}
      />
    </div>
  );
});

export default TiptapEditor; 