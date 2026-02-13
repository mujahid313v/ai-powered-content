const axios = require('axios');

class AIService {
  async analyzeText(text) {
    try {
      const response = await axios.post(
        process.env.TOXICITY_API_URL,
        { text },
        {
          headers: { 'Authorization': `Bearer ${process.env.ML_API_KEY}` },
          timeout: 10000
        }
      );
      
      return {
        toxicity_score: response.data.toxicity || 0,
        hate_speech_score: response.data.hate_speech || 0,
        spam_score: response.data.spam || 0,
        overall_score: response.data.overall || 0,
        decision: this.getDecision(response.data.overall || 0),
        raw_response: response.data
      };
    } catch (error) {
      console.error('Text analysis error:', error.message);
      return this.getFallbackResult();
    }
  }

  async analyzeImage(imageUrl) {
    try {
      const response = await axios.post(
        process.env.NSFW_API_URL,
        { image_url: imageUrl },
        {
          headers: { 'Authorization': `Bearer ${process.env.ML_API_KEY}` },
          timeout: 15000
        }
      );
      
      return {
        nsfw_score: response.data.nsfw || 0,
        overall_score: response.data.nsfw || 0,
        decision: this.getDecision(response.data.nsfw || 0),
        raw_response: response.data
      };
    } catch (error) {
      console.error('Image analysis error:', error.message);
      return this.getFallbackResult();
    }
  }

  async analyzeVideo(videoUrl) {
    try {
      const response = await axios.post(
        process.env.VIDEO_API_URL,
        { video_url: videoUrl },
        {
          headers: { 'Authorization': `Bearer ${process.env.ML_API_KEY}` },
          timeout: 30000
        }
      );
      
      return {
        nsfw_score: response.data.nsfw || 0,
        overall_score: response.data.overall || 0,
        decision: this.getDecision(response.data.overall || 0),
        raw_response: response.data
      };
    } catch (error) {
      console.error('Video analysis error:', error.message);
      return this.getFallbackResult();
    }
  }

  getDecision(score) {
    if (score >= 80) return 'unsafe';
    if (score >= 50) return 'review_needed';
    return 'safe';
  }

  getFallbackResult() {
    return {
      toxicity_score: 0,
      nsfw_score: 0,
      spam_score: 0,
      hate_speech_score: 0,
      overall_score: 50,
      decision: 'review_needed',
      raw_response: { error: 'AI service unavailable' }
    };
  }
}

module.exports = new AIService();
