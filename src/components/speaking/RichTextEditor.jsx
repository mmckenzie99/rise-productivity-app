import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const modules = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ color: [] }, { background: [] }],
    ['link'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean']
  ]
};

export default function RichTextEditor({ value, onChange, placeholder }) {
  return (
    <div className="rich-notes">
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder || ''}
      />
    </div>
  );
}