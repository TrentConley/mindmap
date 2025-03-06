import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

interface LatexContentProps {
  content: string;
}

const LatexContent: React.FC<LatexContentProps> = ({ content }) => {
  return (
    <div className="latex-content">
      <Latex>{content}</Latex>
    </div>
  );
};

export default LatexContent;