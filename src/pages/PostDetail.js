import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Button, Avatar } from '@mui/material';
import { getPosts, incrementPostViews } from '../services/postService';
import { getPostComments, addComment, deleteComment } from '../services/commentService';
import { useAuth } from '../contexts/AuthContext';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';

// HTML etiketlerini ve görsel URL'lerini temizleyen gelişmiş fonksiyon
function stripHtml(html) {
  if (!html) return '';
  
  let cleanText = html;
  
  // Markdown formatındaki görselleri kaldır ![alt](url)
  cleanText = cleanText.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
  
  // Mobil format [IMAGE:...] kaldır
  cleanText = cleanText.replace(/\[IMAGE:[^\]]+\]/g, '');
  
  // HTML img taglerini kaldır
  cleanText = cleanText.replace(/<img[^>]*>/gi, '');
  
  // Diğer HTML taglerini kaldır
  const tmp = document.createElement('DIV');
  tmp.innerHTML = cleanText;
  
  let textContent = tmp.textContent || tmp.innerText || '';
  
  // Fazla boşlukları temizle
  textContent = textContent.replace(/\s+/g, ' ').trim();
  
  return textContent;
}

// İçerikten ilk img src'sini bul (hem HTML hem mobil format)
function getFirstImageSrc(html) {
  // HTML img tag formatını kontrol et
  const htmlMatch = html.match(/<img[^>]+src=["']([^"']+)["']/);
  if (htmlMatch) return htmlMatch[1];
  
  // Mobil format [IMAGE:...] kontrol et
  const mobileMatch = html.match(/\[IMAGE:([^\]]+)\]/);
  if (mobileMatch) return mobileMatch[1];
  
  return null;
}

// İçerikten ilk img tag'ini kaldır (hem HTML hem mobil format)
function removeFirstImgTag(html) {
  // HTML img tag'ini kaldır
  html = html.replace(/<img[^>]+src=["'][^"']+["'][^>]*>/, '');
  
  // Mobil format [IMAGE:...] kaldır
  html = html.replace(/\[IMAGE:[^\]]+\]/, '');
  
  return html;
}

// Mobil formatındaki görselleri HTML'e çevir
function convertMobileImagesToHtml(content) {
  if (!content) return content;
  
  // [IMAGE:URL] formatını <img> tagine çevir
  return content.replace(/\[IMAGE:([^\]]+)\]/g, '<img src="$1" alt="Görsel" style="max-width: 100%; height: auto; display: block; margin: 16px auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />');
}

// Markdown formatını HTML'e çevir (ajan içerikleri için)
function convertMarkdownToHtml(content) {
  if (!content) return content;
  
  let html = content;
  
  // Markdown başlıkları çevir
  html = html.replace(/^## (.+)$/gm, '<h2 style="font-size: 1.5rem; font-weight: 700; margin: 24px 0 16px 0; color: #1a1a1a;">$1</h2>');
  html = html.replace(/^### (.+)$/gm, '<h3 style="font-size: 1.25rem; font-weight: 600; margin: 20px 0 12px 0; color: #2a2a2a;">$1</h3>');
  html = html.replace(/^#### (.+)$/gm, '<h4 style="font-size: 1.1rem; font-weight: 600; margin: 16px 0 8px 0; color: #3a3a3a;">$1</h4>');
  
  // Kalın yazı formatı
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: 600;">$1</strong>');
  
  // İtalik yazı formatı
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Link formatı
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" style="color: #1976d2; text-decoration: underline;">$1</a>');
  
  // Liste formatı (- ile başlayan)
  html = html.replace(/^- (.+)$/gm, '<li style="margin: 4px 0;">$1</li>');
  html = html.replace(/(<li[^>]*>.*<\/li>)/gs, '<ul style="margin: 12px 0; padding-left: 20px;">$1</ul>');
  
  // Paragrafları ayır ve <p> taglerinde sarmak
  const paragraphs = html.split(/\n\s*\n/);
  html = paragraphs.map(paragraph => {
    paragraph = paragraph.trim();
    if (!paragraph) return '';
    
    // Eğer zaten HTML tag'i varsa (h2, h3, ul, etc.) olduğu gibi bırak
    if (paragraph.match(/^<(h[1-6]|ul|ol|blockquote|div)/)) {
      return paragraph;
    }
    
    // Görsel tag'i varsa olduğu gibi bırak
    if (paragraph.includes('<img')) {
      return paragraph;
    }
    
    // Diğer durumlarda p tag'i ile sarmak
    return `<p style="margin: 12px 0; line-height: 1.6; color: #333;">${paragraph}</p>`;
  }).join('');
  
  return html;
}

const PostDetail = () => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { postId } = useParams();
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const [commentSuccess, setCommentSuccess] = useState('');
  const { currentUser } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { posts } = await getPosts();
        const found = posts.find(p => p.id === postId);
        if (found) {
          setPost(found);
          // Görüntülenme sayısını artır
          incrementPostViews(postId);
        } else {
          setError('Gönderi bulunamadı.');
        }
      } catch (err) {
        setError('Gönderi yüklenemedi. Lütfen tekrar deneyin.');
      }
      setLoading(false);
    };
    fetchPost();
  }, [postId]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setCommentLoading(true);
        const fetched = await getPostComments(postId, 50);
        setComments(fetched);
      } catch (err) {
        setComments([]);
      }
      setCommentLoading(false);
    };
    if (postId) fetchComments();
  }, [postId]);

  const handleAddComment = async () => {
    if (!currentUser) {
      setCommentError('Yorum yapmak için giriş yapmalısınız.');
      return;
    }
    if (!commentText.trim()) {
      setCommentError('Yorum boş olamaz.');
      return;
    }
    setCommentLoading(true);
    setCommentError('');
    setCommentSuccess('');
    try {
      await addComment({
        postId,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email || 'Anonim',
        text: commentText.trim(),
      });
      setCommentText('');
      setCommentSuccess('Yorumunuz eklendi!');
      // Yorumları tekrar yükle
      const fetched = await getPostComments(postId, 50);
      setComments(fetched);
    } catch (err) {
      setCommentError('Yorum eklenirken hata oluştu.');
    }
    setCommentLoading(false);
  };

  const handleDeleteComment = async (commentId) => {
    if (!currentUser) return;
    setCommentLoading(true);
    setCommentError('');
    try {
      await deleteComment(commentId, postId);
      const fetched = await getPostComments(postId, 50);
      setComments(fetched);
    } catch (err) {
      setCommentError('Yorum silinirken hata oluştu.');
    }
    setCommentLoading(false);
  };

  if (loading) {
    return (
      <Container>
        <Typography>Yükleniyor...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  const coverImg = getFirstImageSrc(post.content);
  const contentWithoutCover = removeFirstImgTag(post.content);
  let convertedContent = convertMobileImagesToHtml(contentWithoutCover);
  convertedContent = convertMarkdownToHtml(convertedContent);

  return (
    <Box
      sx={{
        background: '#fff',
        color: theme.palette.text.primary,
        borderRadius: 2,
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        maxWidth: 740,
        margin: '48px auto',
        p: { xs: 2, sm: 5 },
        mt: 6,
        transition: 'background 0.3s, color 0.3s',
      }}
      className="post-detail-container"
    >
      <div className="post-detail-title" style={{ color: theme.palette.text.primary }}>{stripHtml(post.title)}</div>
      <div className="post-detail-meta" style={{ color: theme.palette.text.secondary, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar src={post.authorAvatar} sx={{ width: 36, height: 36, fontSize: 20, mr: 1 }}>
          {post.authorName ? post.authorName[0] : '?'}
        </Avatar>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 600, mr: 1, cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => navigate(`/profile/${post.authorId}`)}
        >
          {post.authorName || 'Anonim'}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
          @{post.authorUsername}
        </Typography>
        <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString('tr-TR') : ''}</span>
      </div>
      {coverImg && <img src={coverImg} alt="Kapak" className="post-detail-cover" />}
      <div className="post-detail-content" style={{ color: theme.palette.text.primary }} dangerouslySetInnerHTML={{ __html: convertedContent }} />
      {/* Yorumlar Bölümü */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" sx={{ mb: 2, color: theme.palette.text.primary }}>Yorumlar</Typography>
        {commentLoading && <CircularProgress size={24} />}
        {commentError && <Alert severity="error" sx={{ mb: 2 }}>{commentError}</Alert>}
        {commentSuccess && <Alert severity="success" sx={{ mb: 2 }}>{commentSuccess}</Alert>}
        {currentUser && (
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              maxRows={6}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Yorumunuzu yazın..."
              disabled={commentLoading}
            />
            <Button variant="contained" onClick={handleAddComment} disabled={commentLoading || !commentText.trim()}>
              Gönder
            </Button>
          </Box>
        )}
        <Box>
          {comments.length === 0 && !commentLoading && (
            <Typography color="text.secondary">Henüz yorum yok.</Typography>
          )}
          {comments.map((c) => (
            <Box key={c.id} sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ width: 28, height: 28, fontSize: 16, mr: 1 }}>{c.userName ? c.userName[0] : '?'}</Avatar>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{c.userName || 'Anonim'}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                  {c.createdAt && c.createdAt.toDate ? c.createdAt.toDate().toLocaleString('tr-TR') : ''}
                </Typography>
                {currentUser && c.userId === currentUser.uid && (
                  <Button
                    size="small"
                    color="error"
                    sx={{ ml: 2, minWidth: 0, p: 0.5 }}
                    onClick={() => handleDeleteComment(c.id)}
                    title="Yorumu Sil"
                  >
                    <DeleteIcon fontSize="small" />
                  </Button>
                )}
              </Box>
              <Typography variant="body1">{c.text}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
      <Button variant="contained" color="primary" sx={{ mt: 4 }} onClick={() => navigate(-1)}>
        Geri Dön
      </Button>
    </Box>
  );
};

export default PostDetail; 