package org.catudo.sentiment.sentimentanalyststreaming.service;

import ai.djl.MalformedModelException;
import ai.djl.inference.Predictor;
import ai.djl.modality.Classifications;
import ai.djl.repository.zoo.Criteria;
import ai.djl.repository.zoo.ModelNotFoundException;
import ai.djl.repository.zoo.ZooModel;
import ai.djl.training.util.ProgressBar;
import ai.djl.translate.TranslateException;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;

@Service
public class SimpleSentimentService implements SentimentService {

    @Override
    public SentimentResult analyze(String text) {

		Criteria<String, Classifications> criteria = Criteria.builder()
				.setTypes(String.class, Classifications.class)
				.optModelUrls("djl://ai.djl.huggingface.pytorch/tabularisai/multilingual-sentiment-analysis")
				.optEngine("PyTorch")
				.optOption("hasParameter", "false") // HuggingFace models often need this
				.optProgress(new ProgressBar())
				.build();

		try (ZooModel<String, Classifications> model = criteria.loadModel();
			 Predictor<String, Classifications> predictor = model.newPredictor()) {

			Classifications result = predictor.predict(text);

			for (Classifications.Classification c : result.items()) {
				System.out.printf("%s: %.4f%n", c.getClassName(), c.getProbability());
			}
			return SentimentResult.builder().label(result.best().getClassName()).score(result.best().getProbability()).build();

		} catch (ModelNotFoundException e) {
			throw new RuntimeException(e);
		} catch (MalformedModelException e) {
			throw new RuntimeException(e);
		} catch (IOException e) {
			throw new RuntimeException(e);
		} catch (TranslateException e) {
			throw new RuntimeException(e);
		}
	}
}
