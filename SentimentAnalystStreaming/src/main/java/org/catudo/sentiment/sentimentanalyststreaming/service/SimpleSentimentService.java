package org.catudo.sentiment.sentimentanalyststreaming.service;

import ai.djl.MalformedModelException;
import ai.djl.inference.Predictor;
import ai.djl.modality.Classifications;
import ai.djl.repository.zoo.Criteria;
import ai.djl.repository.zoo.ModelNotFoundException;
import ai.djl.repository.zoo.ZooModel;
import ai.djl.training.util.ProgressBar;
import ai.djl.translate.TranslateException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.nio.file.Path;
import java.util.Map;

import lombok.extern.slf4j.Slf4j;
import ai.djl.huggingface.translator.TextClassificationTranslatorFactory;


@Service
@Slf4j
public class SimpleSentimentService implements SentimentService {


	@Value("${model.path}")
	public static String MODEL_PATH;

	@Override
	public SentimentResult analyze(String text) {

		Criteria<String, Classifications> criteria = Criteria.builder()
				.setTypes(String.class, Classifications.class)
				.optModelUrls(MODEL_PATH)
				.optEngine("PyTorch")
				.optTranslatorFactory(new TextClassificationTranslatorFactory())
				.optProgress(new ProgressBar())
				.optArguments(Map.of("tokenizer", Path.of(MODEL_PATH)
						                                  .resolveSibling("tokenizer.json").toString()))
				.build();

		// 2. Load the model and create a predictor
		try (ZooModel<String, Classifications> model = criteria.loadModel();
				Predictor<String, Classifications> predictor = model.newPredictor()) {

			// 3. Run Inference
			Classifications result = predictor.predict(text);

			return SentimentResult.builder()
					.score(result.best().getProbability())
					.label(result.best().getClassName())
					.build();

		} catch (ModelNotFoundException | MalformedModelException | IOException | TranslateException e) {
			throw new RuntimeException(e);
		}

	}

}
