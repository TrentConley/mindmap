import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

interface LatexContentProps {
  content: string;
  scrollable?: boolean;
}

const LatexContent: React.FC<LatexContentProps> = ({ content, scrollable = false }) => {
  return (
    <div className={`latex-content text-sm ${scrollable ? 'latex-content-scrollable' : ''}`}>
      <Latex>{content}</Latex>
    </div>
  );
};

export default LatexContent;